const crypto = require("crypto");
const https = require("https");
const db = require("../config/db");

const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
  redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3000/payment/success",
  ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:5000/api/momo-payment/callback",
};

const createPayment = async ({ userId, amount, orderInfo, upgradeType = "broker" }) => {
  const orderId = `${userId}_${Date.now()}`;
  const requestId = orderId;
  const requestType = "captureWallet";

  const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac("sha256", MOMO_CONFIG.secretKey).update(rawSignature).digest("hex");

  const requestBody = {
    partnerCode: MOMO_CONFIG.partnerCode,
    accessKey: MOMO_CONFIG.accessKey,
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: MOMO_CONFIG.redirectUrl,
    ipnUrl: MOMO_CONFIG.ipnUrl,
    extraData: "",
    requestType: requestType,
    signature: signature,
    lang: "vi",
  };

  const momoResponse = await new Promise((resolve, reject) => {
    const req = https.request(
      MOMO_CONFIG.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error("Invalid JSON response from MoMo"));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(JSON.stringify(requestBody));
    req.end();
  });

  if (momoResponse.resultCode === 0) {
    try {
      await db.promise().query(
        `INSERT INTO GIAODICH (MaNgDung, OrderId, Amount, OrderInfo, UpgradeType, LoaiDichVu, PhuongThucThanhToan, TrangThai, NgayTao) 
         VALUES (?, ?, ?, ?, ?, 'NANG_CAP_MOI_GIOI', 'MoMo', 'PENDING', NOW())`,
        [userId, orderId, amount, orderInfo, upgradeType]
      );
    } catch (dbError) {
      console.error("Database error saving transaction:", dbError);
    }

    return {
      success: true,
      payUrl: momoResponse.payUrl,
      orderId: orderId,
      qrCodeUrl: momoResponse.qrCodeUrl || momoResponse.payUrl,
    };
  }

  const err = new Error("Tạo giao dịch MoMo thất bại");
  err.momoResponse = momoResponse;
  throw err;
};

const handleCallback = async (callbackData) => {
  const { orderId, transId, resultCode } = callbackData;

  if (resultCode === 0) {
    await db
      .promise()
      .query(`UPDATE GIAODICH SET TrangThai = 'SUCCESS', TransId = ?, NgayCapNhat = NOW() WHERE OrderId = ?`, [
        transId,
        orderId,
      ]);

    const [transactions] = await db.promise().query(`SELECT * FROM GIAODICH WHERE OrderId = ?`, [orderId]);
    if (transactions.length > 0) {
      const transaction = transactions[0];
      // Cập nhật trạng thái thanh toán trong hồ sơ xác minh môi giới (nếu có)
      await db.promise().query(
        `UPDATE XACMINHMOIGIOI 
         SET TrangThaiThanhToan = 'DA_THANH_TOAN', MaGiaoDichMoMo = ?, PhuongThucThanhToan = 'MoMo' 
         WHERE MaNgDung = ? AND TrangThai = 'PENDING'`,
        [transId, transaction.MaNgDung]
      );
    }
  } else {
    await db
      .promise()
      .query(`UPDATE GIAODICH SET TrangThai = 'FAILED', NgayCapNhat = NOW() WHERE OrderId = ?`, [orderId]);
  }

  return true;
};

const checkStatus = async (orderId, userId) => {
  const [transactions] = await db
    .promise()
    .query(`SELECT * FROM GIAODICH WHERE OrderId = ? AND MaNgDung = ?`, [orderId, userId]);

  if (transactions.length === 0) {
    return null;
  }

  const transaction = transactions[0];
  if (transaction.TrangThai === "PENDING") {
    const requestId = orderId;
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&orderId=${orderId}&partnerCode=${MOMO_CONFIG.partnerCode}&requestId=${requestId}`;
    const signature = crypto.createHmac("sha256", MOMO_CONFIG.secretKey).update(rawSignature).digest("hex");

    const queryBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      accessKey: MOMO_CONFIG.accessKey,
      requestId: requestId,
      orderId: orderId,
      signature: signature,
      lang: "vi",
    };

    try {
      const momoStatusResponse = await new Promise((resolve, reject) => {
        const req = https.request(
          "https://test-payment.momo.vn/v2/gateway/api/query",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (error) {
                reject(error);
              }
            });
          }
        );
        req.on("error", reject);
        req.write(JSON.stringify(queryBody));
        req.end();
      });

      if (momoStatusResponse.resultCode === 0) {
        await db
          .promise()
          .query(`UPDATE GIAODICH SET TrangThai = 'SUCCESS', TransId = ?, NgayCapNhat = NOW() WHERE OrderId = ?`, [
            momoStatusResponse.transId,
            orderId,
          ]);

        // Cập nhật trạng thái thanh toán trong hồ sơ xác minh môi giới (nếu có)
        await db.promise().query(
          `UPDATE XACMINHMOIGIOI 
           SET TrangThaiThanhToan = 'DA_THANH_TOAN', MaGiaoDichMoMo = ?, PhuongThucThanhToan = 'MoMo' 
           WHERE MaNgDung = ? AND TrangThai = 'PENDING'`,
          [momoStatusResponse.transId, transaction.MaNgDung]
        );
        transaction.TrangThai = "SUCCESS";
      } else if (momoStatusResponse.resultCode === 1006) {
        await db
          .promise()
          .query(`UPDATE GIAODICH SET TrangThai = 'FAILED', NgayCapNhat = NOW() WHERE OrderId = ?`, [orderId]);
        transaction.TrangThai = "FAILED";
      }
    } catch (queryError) {
      console.error("Error querying MoMo status:", queryError);
    }
  }

  return transaction;
};

module.exports = {
  createPayment,
  handleCallback,
  checkStatus,
};
