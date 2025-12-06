const PropertyDescription = ({ description }) => {
  return (
    <div className="p-6 transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl animate-fadeInUp">
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        Mô tả chi tiết
      </h2>
      <div className="text-gray-700 leading-relaxed whitespace-pre-line">
        {description || (
          <p className="text-gray-400 italic">Không có mô tả chi tiết.</p>
        )}
      </div>
    </div>
  );
};

export default PropertyDescription;
