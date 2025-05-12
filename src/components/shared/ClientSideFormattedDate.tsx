
"use client";

import React, { useState, useEffect } from 'react';
import { format as formatDateFn, parseISO, isValid } from 'date-fns';

interface ClientSideFormattedDateProps {
  date?: string | Date | null;
  format?: string; // e.g., "PPP" for date, "PPpp" for date and time
  loadingText?: string;
  notAvailableText?: string;
  prefix?: string;
  className?: string;
}

const ClientSideFormattedDate: React.FC<ClientSideFormattedDateProps> = ({
  date: dateProp,
  format = "PPP", // Default to date only format like "Jul 22, 2024"
  loadingText = "Loading...",
  notAvailableText = "N/A",
  prefix = "",
  className = "",
}) => {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!dateProp) {
      setFormattedDate(notAvailableText);
      return;
    }

    let dateObj: Date;
    if (typeof dateProp === 'string') {
      // Handle YYYY-MM-DD strings as UTC to represent the calendar day correctly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateProp)) {
        const [year, month, day] = dateProp.split('-').map(Number);
        dateObj = new Date(Date.UTC(year, month - 1, day));
      } else {
        dateObj = parseISO(dateProp); // For full ISO strings or other parsable formats
      }
    } else {
      dateObj = dateProp; // Already a Date object
    }

    if (!isValid(dateObj)) {
      setFormattedDate(notAvailableText);
      return;
    }

    // Perform formatting on the client side
    try {
      setFormattedDate(formatDateFn(dateObj, format));
    } catch (error) {
      console.error("Error formatting date:", error);
      setFormattedDate(notAvailableText);
    }
  }, [dateProp, format, notAvailableText]);

  if (formattedDate === null) {
    return <span className={className}>{prefix}{loadingText}</span>;
  }

  return <span className={className}>{prefix}{formattedDate}</span>;
};

export default ClientSideFormattedDate;

    
