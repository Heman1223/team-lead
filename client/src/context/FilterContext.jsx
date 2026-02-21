import { createContext, useContext, useState, useEffect } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59)
    });

    const updateMonth = (month) => {
        const m = parseInt(month);
        setSelectedMonth(m);
        const start = new Date(selectedYear, m, 1);
        const end = new Date(selectedYear, m + 1, 0, 23, 59, 59);
        setDateRange({ startDate: start, endDate: end });
    };

    const updateYear = (year) => {
        const y = parseInt(year);
        setSelectedYear(y);
        const start = new Date(y, selectedMonth, 1);
        const end = new Date(y, selectedMonth + 1, 0, 23, 59, 59);
        setDateRange({ startDate: start, endDate: end });
    };

    const updateDateRange = (range) => {
        // range: { startDate, endDate }
        setDateRange(range);
        // Also update month/year if the range falls within a specific month
        if (range.startDate.getMonth() === range.endDate.getMonth() && 
            range.startDate.getFullYear() === range.endDate.getFullYear()) {
            setSelectedMonth(range.startDate.getMonth());
            setSelectedYear(range.startDate.getFullYear());
        }
    };

    const setPresetRange = (preset) => {
        const now = new Date();
        let start, end;

        switch (preset) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'thisWeek':
                const first = now.getDate() - now.getDay();
                start = new Date(now.setDate(first));
                start.setHours(0, 0, 0, 0);
                end = new Date();
                end.setHours(23, 59, 59, 999);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
            case 'allTime':
                start = new Date(2020, 0, 1);
                end = new Date();
                break;
            default:
                return;
        }
        setDateRange({ startDate: start, endDate: end });
        setSelectedMonth(start.getMonth());
        setSelectedYear(start.getFullYear());
    };

    return (
        <FilterContext.Provider value={{
            selectedMonth,
            selectedYear,
            dateRange,
            updateMonth,
            updateYear,
            updateDateRange,
            setPresetRange
        }}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilters = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
};
