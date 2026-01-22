import React from "react";
const MobileOptions = ({ open, onClose }) => {
  return (
    <div className="fixed inset-0 md:hidden z-50 pointer-events-none">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 left-0 h-full w-64 bg-white shadow-lg
          transform transition-transform duration-500 ease-in-out pointer-events-auto
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 space-y-4">
          <p className="cursor-pointer hover:text-purple-600 transition-colors font-medium" onClick={onClose}>
            Home
          </p>
          <p className="cursor-pointer hover:text-purple-600 transition-colors font-medium" onClick={onClose}>
            Contact
          </p>
          <p className="cursor-pointer hover:text-purple-600 transition-colors font-medium" onClick={onClose}>
            About
          </p>
          <p className="cursor-pointer hover:text-purple-600 transition-colors font-medium" onClick={onClose}>
            Launch App
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileOptions;
