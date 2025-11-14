import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import "../styles/PriceReference.css"

function RegionalPriceComparison({ comparisonData }) {
  return (
    <div className="regional-comparison-grid">
      {comparisonData.map((region, index) => (
        <div key={index} className="regional-comparison-card">
          <h3 className="regional-comparison-name">{region.name}</h3>

          {/* Price Display */}
          <div className="regional-price-display">
            <div className="regional-price-value">{region.currentPrice.toLocaleString()}</div>
            <p className="regional-price-unit">Triệu/m2</p>
          </div>

          {/* Range Bar */}
          <div className="regional-range-bar">
            <div
              className="regional-range-track"
              style={{
                backgroundImage: `linear-gradient(to right, ${region.color}, ${region.color}cc)`,
              }}
            >
              <div
                className="regional-range-indicator"
                style={{
                  left: `${((region.currentPrice - region.minPrice) / (region.maxPrice - region.minPrice)) * 100}%`,
                  borderColor: region.color,
                }}
              />
            </div>

            <div className="regional-range-labels">
              <span>{region.minPrice.toLocaleString()}</span>
              <span className="regional-range-center">Khoảng giá phổ biến T10/2025</span>
              <span>{region.maxPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Trend Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={region.trendData}>
              <defs>
                <linearGradient id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={region.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={region.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" stroke="#999" fontSize={12} />
              <YAxis stroke="#999" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                formatter={(value) => value.toLocaleString()}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={region.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color${index})`}
              />
            </AreaChart>
          </ResponsiveContainer>

          <p className="regional-detail-link">Xem {region.detailLink} tin khác &gt;</p>
        </div>
      ))}
    </div>
  )
}

export default RegionalPriceComparison
