import React from 'react';

const ResourceCard = ({ resource, onSelect }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'lab':
        return '🖥️';
      case 'seminar_hall':
        return '🎓';
      case 'projector':
        return '🎬';
      default:
        return '📦';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getTypeIcon(resource.type)}</span>
            <h3 className="font-bold text-lg text-gray-900">{resource.name}</h3>
          </div>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {resource.type.replace('_', ' ')}
          </span>
        </div>
        {resource.is_active ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Available
          </span>
        ) : (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            Unavailable
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4 text-gray-600">
        <p className="text-sm">
          <span className="font-medium">Location:</span> {resource.location}
        </p>
        <p className="text-sm">
          <span className="font-medium">Capacity:</span> {resource.capacity} people
        </p>
      </div>

      {onSelect && (
        <button
          onClick={() => onSelect(resource.id)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Book Now
        </button>
      )}
    </div>
  );
};

export default ResourceCard;
