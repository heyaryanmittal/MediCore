import React from 'react';

const Placeholder = ({ title }) => {
    return (
        <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-gray-600">This module is currently under development.</p>
        </div>
    );
};

export default Placeholder;
