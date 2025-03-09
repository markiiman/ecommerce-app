import React from "react";

const AnnouncementBar = () => {
  return (
    <div className="w-full bg-black py-2">
      <div className="container mx-auto flex items-center justify-center px-8">
        <span className="text-center text-sm font-medium tracking-wide text-white">
          FREE SHIPPING ON ORDERS OVER $15.00 • FREE RETURNS
        </span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
