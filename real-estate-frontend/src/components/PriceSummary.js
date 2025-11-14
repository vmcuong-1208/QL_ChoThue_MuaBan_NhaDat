import "../styles/PriceReference.css"

function PriceSummary({ priceData }) {
  const { currentPrice, priceLastMonth, priceLastYear } = priceData

  const monthChange = (((currentPrice - priceLastMonth) / priceLastMonth) * 100).toFixed(1)
  const yearChange = (((currentPrice - priceLastYear) / priceLastYear) * 100).toFixed(1)

  const monthChangeColor = monthChange >= 0 ? "#22c55e" : "#ef4444"
  const yearChangeColor = yearChange >= 0 ? "#22c55e" : "#ef4444"

  return (
    <div className="price-summary-grid">
      <div className="price-summary-card price-summary-current">
        <div className="price-summary-value">{currentPrice.toLocaleString()}</div>
        <p className="price-summary-label">Giá trung bình tháng 10/2025</p>
        <p className="price-summary-unit">Triệu/m2</p>
      </div>

      <div className="price-summary-card price-summary-month">
        <div className="price-summary-change" style={{ color: monthChangeColor }}>
          {monthChange > 0 ? "📈" : "📉"}
          {monthChange > 0 ? "+" : ""}
          {monthChange}%
        </div>
        <p className="price-summary-label">So với tháng 9/2025</p>
      </div>

      <div className="price-summary-card price-summary-year">
        <div className="price-summary-change" style={{ color: yearChangeColor }}>
          {yearChange > 0 ? "📈" : "📉"}
          {yearChange > 0 ? "+" : ""}
          {yearChange}%
        </div>
        <p className="price-summary-label">So với tháng 10/2024</p>
      </div>
    </div>
  )
}

export default PriceSummary
