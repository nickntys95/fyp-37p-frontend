import React, { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';

const SearchBar = ({ setResults, setError, categories = [] }) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const token = sessionStorage.getItem("token") || "";

  const fetchSearch = async (value, category) => {
    if (!value || value.trim() === "") {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api2/listing/search', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: value,
          category: category
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const categoryMap = {
        auction_strategy: 'auction_strategy',
        item_type: 'item_type',
        title: 'title',
        description: 'description',
        minimum_bid: 'minimum_bid',
        auction_duration: 'auction_duration',
        buy_now: 'buy_now',
      };

      const filteredResults = data.results.filter((result) => {
        if (category in categoryMap) {
          const fieldValue = result[categoryMap[category]];
          if (category === 'auction_duration') {
            const startDate = new Date(result.start_at);
            const endDate = new Date(result.end_at);
            const durationInMilliseconds = endDate.getTime() - startDate.getTime();
            const durationInDays = Math.floor(durationInMilliseconds / (1000 * 60 * 60 * 24));
            return durationInDays === Number(value);
          } else if (typeof fieldValue === 'number') {
            return fieldValue === Number(value);
          } else {
            return fieldValue.toLowerCase() === value.toLowerCase()
              || fieldValue.toLowerCase() === value
              || fieldValue.toLowerCase().includes(value.toLowerCase());
          }
        } else {
          const values = Object.values(result);
          return values.some((value) => {
            return String(value).toLowerCase() === input.toLowerCase()
              || String(value).toLowerCase().includes(input.toLowerCase());
          });
        }
      });

      if (filteredResults.length === 0) {
        setError({
          title: (
            <span>
              Your search <b>"{value}"</b> did not match any results
            </span>
          ),
          suggestions: [
            "Make sure that all words are spelled correctly.",
            "Try different keywords.",
            "Try more general keywords.",
          ],
        });
      } else {
        setError(null);
      }

      setResults(filteredResults);
      setIsLoading(false);
    } catch (err) {
      console.error("Search Error:", err);
      setError("Error fetching search results: " + err.message);
      setIsLoading(false);
      setResults([]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (input.trim() === "") {
      setResults([]);
      setError(null);
      return;
    }

    fetchSearch(input, selectedCategory);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  return (
    <div>
      <form className="input-search" onSubmit={handleSubmit}>
        <SearchIcon id="search-icon" />
        <input
          type={selectedCategory === 'minimum_bid' || selectedCategory === 'buy_now' ||
            selectedCategory === 'auction_duration' ? 'number' : 'text'}
          step={selectedCategory === 'minimum_bid' || selectedCategory === 'buy_now'
            || selectedCategory === 'auction_duration' ? '1' : undefined}
          min={selectedCategory === 'minimum_bid' || selectedCategory === 'buy_now'
            || selectedCategory === 'auction_duration' ? '0' : undefined}
          className="input-text"
          placeholder={
            selectedCategory === 'minimum_bid' ? 'Enter Starting Price' :
              selectedCategory === 'buy_now' ? 'Enter Buy-Now Price' :
                selectedCategory === 'auction_duration' ? 'Enter the No. of days' :
                  'Type to Search...'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <select value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">All categories</option>
          <option value="title">Title/Name</option>
          <option value="item_type">Item Type</option>
          <option value="description">Description</option>
          <option type="number" value="minimum_bid">Starting Price</option>
          <option value="auction_strategy">Auction Strategy</option>
          <option type="number" value="auction_duration">Auction Duration</option>
          <option type="number" value="buy_now">Buy-Now Price</option>

          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button type="submit" style={{ display: 'none' }}>Search</button>
      </form>
      {isLoading && <div style={{ fontSize: 12 }}>Loading result...</div>}
    </div>
  );
};

export default SearchBar;