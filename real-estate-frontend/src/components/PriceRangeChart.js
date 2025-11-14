import { XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts"
import "../styles/PriceReference.css"

function PriceTrendChart({ trendData, location }) {
  return (
    <div className="price-trend-chart">
      <h3 className="price-trend-title">Lịch sử giá {location}</h3>

      <div style={{ width: "100%", height: "400px" }}>
        <AreaChart width={800} height={400} data={trendData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff9500" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ff9500" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="month" stroke="#999" />
          <YAxis stroke="#999" />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc", borderRadius: "8px" }}
            formatter={(value) => value.toLocaleString() + " triệu/m2"}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#ff9500"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </div>

      <p className="price-trend-link">Xem 101 tin khác &gt;</p>
    </div>
  )
}

export default PriceTrendChart
