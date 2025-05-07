# BJT Product Management System Developer Guide

This directory contains guides, documentation, and examples for the BJT Product Management System. These resources are designed to help developers understand and use the system's components, architecture, and APIs effectively.

## Available Resources

### UI Components

- **[UI Components Guide](ui-components.md)**: Comprehensive documentation of all UI components available in the project, including buttons, cards, forms, tables, and more.
- **[UI Components Example](ui-components-example.tsx)**: A React component that demonstrates the UI components in action. This can be viewed in the browser by visiting the `/guide` route.

## How to Use

### Accessing the Guide

You can access the guide in the following ways:

1. **In the Application**: When running the application, navigate to the `/guide` route to view the interactive guide and examples.
2. **Source Files**: Browse the markdown files directly in this directory to read the documentation.

### Using the UI Component Library

The UI component library consists of:

1. **CSS Styles**: Located in `src/styles/components.css` and `src/styles/theme.css`.
2. **React Components**: Located in `src/components/common/`.

To use these components in your code:

```tsx
// Import the CSS (this is typically done at the app root level)
import '../styles/global.css';

// Import React components
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

// Use the components in your JSX
<Button variant="primary" size="md">Click Me</Button>

<Input 
  label="Username" 
  helperText="Enter your username"
  error={null}
  fullWidth={true}
/>

// Use CSS classes directly
<div className="card">
  <div className="card-body">
    <h3 className="card-title">Card Title</h3>
    <p>Card content</p>
  </div>
</div>
```

## Best Practices

1. **Consistency**: Use the provided UI components and styles consistently throughout the application.
2. **Theme Variables**: Use CSS variables from the theme system for custom styling.
3. **Responsive Design**: Ensure your layouts work well on all screen sizes using the provided responsive utilities.
4. **Accessibility**: Maintain accessibility by using proper labels, ARIA attributes, and semantic HTML.
5. **Tailwind Integration**: Leverage the Tailwind CSS utilities alongside the component library for custom styling.

## Contributing to the Guide

If you would like to contribute to this guide or add new examples:

1. Create or update markdown files in this directory for documentation.
2. Create example components to demonstrate functionality.
3. Update the `index.tsx` file to include links to your new resources.

## Getting Help

If you need assistance with the UI component library or any other aspect of the system, please contact the development team or check the project's main README file for support information. 