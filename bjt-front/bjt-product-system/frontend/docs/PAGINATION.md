# Pagination Implementation Documentation

## Overview

This document describes the implementation of pagination in the Products page of the BJT e-commerce system. The pagination feature helps improve page load times and user experience by displaying products in manageable chunks rather than showing all products at once.

## Features

- **Page Navigation**: Users can navigate between pages using next/previous buttons or by clicking specific page numbers.
- **Items Per Page Selection**: Users can choose how many products to display per page (5, 10, or 20).
- **Responsive Design**: The pagination controls adapt to different screen sizes.
- **Current Page Highlighting**: The current page number is visually highlighted.
- **Automatic Page Count**: The total number of pages is calculated based on the number of products and items per page.

## Implementation Details

### State Management

The pagination feature uses the following React state variables:

```typescript
const [currentPage, setCurrentPage] = useState<number>(1);
const [itemsPerPage, setItemsPerPage] = useState<number>(5);
const [totalPages, setTotalPages] = useState<number>(1);
```

### Key Functions

1. **Page Change Handler**:
   ```typescript
   const handlePageChange = (pageNumber: number) => {
     setCurrentPage(pageNumber);
     // Scrolls to the top of the product list for better UX
     const productList = document.querySelector('.product-list');
     if (productList) {
       productList.scrollIntoView({ behavior: 'smooth' });
     }
   };
   ```

2. **Current Page Products Getter**:
   ```typescript
   const getCurrentPageProducts = () => {
     const indexOfLastItem = currentPage * itemsPerPage;
     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
     return products.slice(indexOfFirstItem, indexOfLastItem);
   };
   ```

3. **Total Pages Calculation**:
   ```typescript
   useEffect(() => {
     setTotalPages(Math.ceil(products.length / itemsPerPage));
     setCurrentPage(1); // Reset to first page when filters change
   }, [products, itemsPerPage, selectedType, selectedCapacity, selectedPrice]);
   ```

### UI Components

The pagination UI includes:
- Previous/Next buttons
- Numbered page buttons
- Items per page dropdown selector

The pagination controls are only displayed when there is more than one page of products.

## CSS Styling

The pagination uses dedicated CSS classes for styling that maintain consistency with the rest of the application's design system:

- `.pagination` - Main container for pagination controls
- `.pagination-button` - Style for prev/next buttons
- `.pagination-page` - Style for individual page number buttons
- `.pagination-page.active` - Style for the currently selected page
- `.items-per-page` - Container for the items per page selector

## Best Practices Implemented

1. **Memory Efficiency**: Only the current page of products is rendered, reducing DOM size.
2. **Reset on Filter Change**: When filters change, the pagination resets to page 1 to avoid confusion.
3. **Smooth Scrolling**: When changing pages, the view smoothly scrolls to the top of the product list.
4. **Responsive Design**: The pagination controls adapt to mobile devices.

## Future Improvements

Potential enhancements for the pagination system include:

1. Server-side pagination for larger product catalogs
2. Remember user's preferred items per page setting
3. Jump-to-page input field for quicker navigation in large catalogs
4. Keyboard navigation support 