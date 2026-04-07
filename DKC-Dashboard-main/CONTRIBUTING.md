# Contributing to DKC Booking Dashboard

> **Copyright DKC UMW, All rights reserved**

Thank you for your interest in contributing to the DKC Booking Dashboard! This document provides guidelines and best practices for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and constructive
- Accept constructive criticism gracefully
- Focus on what's best for the project
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

## 🚀 Getting Started

1. **Read the documentation**
   - [README.md](README.md) - Project overview
   - [ONBOARDING.md](ONBOARDING.md) - Setup instructions
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

2. **Set up your development environment**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd DKC-Dashboard
   
   # Install dependencies
   cd web && npm install
   cd ../api && npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

**Examples:**
```bash
feature/add-csv-export
fix/pagination-bug
docs/update-api-reference
refactor/booking-filters
```

### Development Process

1. **Start with an issue**
   - Check existing issues or create a new one
   - Discuss your approach before starting large changes
   - Get approval for breaking changes

2. **Make your changes**
   - Write clean, readable code
   - Follow existing patterns
   - Add comments for complex logic
   - Update documentation as needed

3. **Test your changes**
   - Test in both development and production builds
   - Test on multiple browsers (Chrome, Firefox, Safari)
   - Test on mobile viewports
   - Ensure no console errors

4. **Update documentation**
   - Add JSDoc comments for new functions
   - Update README if adding features
   - Add examples if creating new APIs

## 📝 Coding Standards

### JavaScript/TypeScript

#### General Principles

- **DRY (Don't Repeat Yourself)** - Extract reusable logic into functions/components
- **KISS (Keep It Simple, Stupid)** - Prefer simple solutions over complex ones
- **YAGNI (You Aren't Gonna Need It)** - Don't add functionality until it's needed

#### Naming Conventions

```typescript
// ✅ Good naming
const userBookings = []; // camelCase for variables
const MAX_BOOKINGS = 100; // UPPER_SNAKE_CASE for constants
function getUserData() {} // camelCase for functions
interface BookingData {} // PascalCase for types/interfaces
const BookingCard = () => {}; // PascalCase for components

// ❌ Bad naming
const user_bookings = []; // snake_case
const maxbookings = 100; // unclear
function getdata() {} // too generic
interface bookingdata {} // wrong case
```

#### Function Guidelines

```typescript
// ✅ Good: Small, focused functions with clear purpose
/**
 * Filters bookings by date range.
 * @param bookings - Array of booking objects
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Filtered array of bookings
 */
function filterBookingsByDate(
  bookings: BookingData[],
  startDate: string,
  endDate: string
): BookingData[] {
  return bookings.filter(booking => {
    const bookingDate = new Date(booking.Date);
    return bookingDate >= new Date(startDate) && 
           bookingDate <= new Date(endDate);
  });
}

// ❌ Bad: Large function doing too many things
function processData(data: any) {
  // 100 lines of code doing multiple things
}
```

#### TypeScript Best Practices

```typescript
// ✅ Good: Use explicit types
interface BookingFilters {
  category: string;
  status: string;
  searchTerm: string;
}

function applyFilters(
  bookings: BookingData[], 
  filters: BookingFilters
): BookingData[] {
  // Implementation
}

// ❌ Bad: Using 'any'
function applyFilters(bookings: any, filters: any): any {
  // Implementation
}

// ✅ Good: Type guards
function isValidBooking(data: unknown): data is BookingData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'Date' in data &&
    'Client' in data
  );
}

// ✅ Good: Optional chaining and nullish coalescing
const clientName = booking?.Client ?? 'Unknown';

// ❌ Bad: Manual null checks everywhere
const clientName = booking && booking.Client ? booking.Client : 'Unknown';
```

### React Components

#### Component Structure

```typescript
// ✅ Good component structure
/**
 * Displays a booking card with details.
 * @param booking - Booking data to display
 * @param onSelect - Callback when card is selected
 */
interface BookingCardProps {
  booking: BookingData;
  onSelect?: (id: string) => void;
}

export function BookingCard({ booking, onSelect }: BookingCardProps) {
  // 1. Hooks at the top
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 2. Derived state and calculations
  const formattedDate = format(new Date(booking.Date), 'PPP');
  
  // 3. Event handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
    onSelect?.(booking.Code);
  };
  
  // 4. Early returns for loading/error states
  if (!booking) return null;
  
  // 5. Main render
  return (
    <Card onClick={handleClick}>
      <CardHeader>
        <CardTitle>{booking.Service}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{booking.Client}</p>
        <p>{formattedDate}</p>
      </CardContent>
    </Card>
  );
}
```

#### Hooks Guidelines

```typescript
// ✅ Good: Custom hooks for reusable logic
function useBookingData(startDate: string, endDate: string) {
  const [data, setData] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchBookings(startDate, endDate)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);
  
  return { data, loading, error };
}

// ❌ Bad: Duplicating fetch logic in every component
function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  // ... repeated in multiple components
}
```

### CSS/Tailwind

```typescript
// ✅ Good: Consistent Tailwind classes
<div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-card">
  <h2 className="text-lg font-semibold text-primary">Title</h2>
  <Button variant="outline" size="sm">Action</Button>
</div>

// ✅ Good: Use cn() utility for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "large" && "large-class"
)}>
  Content
</div>

// ❌ Bad: Inline styles (avoid unless absolutely necessary)
<div style={{ display: 'flex', padding: '16px' }}>
  Content
</div>

// ❌ Bad: String concatenation for classes
<div className={"base " + (isActive ? "active" : "")}>
  Content
</div>
```

### Comments and Documentation

```typescript
// ✅ Good: JSDoc comments for functions
/**
 * Calculates the total number of confirmed bookings.
 * 
 * Filters the bookings array to count only those with a status
 * that includes "confirm" or has a status code of "4".
 * 
 * @param bookings - Array of all bookings to analyze
 * @returns The count of confirmed bookings
 * 
 * @example
 * const confirmed = getConfirmedCount(allBookings);
 * console.log(`${confirmed} confirmed bookings`);
 */
function getConfirmedCount(bookings: BookingData[]): number {
  return bookings.filter(b => 
    b.Status.toLowerCase().includes('confirm') || b.Status === '4'
  ).length;
}

// ✅ Good: Inline comments for complex logic
// Group bookings by date and calculate daily totals
// This is needed for the line chart visualization
const dailyTotals = bookings.reduce((acc, booking) => {
  const date = booking.Date.split(' ')[0]; // Extract YYYY-MM-DD
  acc[date] = (acc[date] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

// ❌ Bad: Obvious comments
// Set loading to true
setLoading(true);

// ❌ Bad: Commented-out code (use git history instead)
// function oldFunction() {
//   // 50 lines of old code
// }
```

## 📝 Commit Guidelines

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

#### Examples

```bash
# Feature
feat(dashboard): add CSV export functionality

# Bug fix
fix(bookings): correct pagination calculation

# Documentation
docs(api): update endpoint descriptions

# Multiple lines
feat(filters): add category filter dropdown

Add new dropdown component for filtering bookings by category.
Includes options for all 5 booking categories.

Closes #123
```

### Atomic Commits

Make small, focused commits:

```bash
# ✅ Good: Separate commits
git commit -m "feat(ui): add booking card component"
git commit -m "feat(ui): add booking list container"
git commit -m "docs(ui): add usage examples for booking components"

# ❌ Bad: One large commit
git commit -m "add booking feature with cards, lists, and docs"
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code runs without errors
- [ ] All features work as expected
- [ ] Tested on Chrome and one other browser
- [ ] Tested on mobile viewport (DevTools)
- [ ] No console errors or warnings
- [ ] Code follows style guidelines
- [ ] Comments and JSDoc added
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

### PR Title Format

Use the same format as commit messages:

```
feat(bookings): add CSV export button
fix(dashboard): resolve chart rendering issue
docs(readme): update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- Tested on Chrome, Firefox
- Tested on mobile viewport
- All existing features still work

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. **Automated checks** (if configured)
   - Build succeeds
   - No linting errors

2. **Code review**
   - At least one approval required
   - Address reviewer comments
   - Request re-review after changes

3. **Merge**
   - Squash and merge for feature branches
   - Keep main branch history clean

## 🧪 Testing

### Manual Testing Checklist

**For all changes:**
- [ ] Run `npm run dev` - app starts without errors
- [ ] Navigate to all pages - no broken routes
- [ ] Check browser console - no errors
- [ ] Check terminal - no server errors

**For UI changes:**
- [ ] Desktop view looks correct
- [ ] Mobile view looks correct (DevTools)
- [ ] Tablet view looks correct
- [ ] Dark mode works
- [ ] Light mode works

**For data features:**
- [ ] Test with empty data
- [ ] Test with large datasets (100+ items)
- [ ] Test with edge cases (special characters, long names)
- [ ] Test filter combinations
- [ ] Test sort directions

**For API changes:**
- [ ] Test with valid inputs
- [ ] Test with invalid inputs
- [ ] Test error handling
- [ ] Test with missing parameters
- [ ] Check response format matches documentation

### Browser Testing

Test on at least **two** of these browsers:
- Chrome (most common)
- Firefox
- Safari
- Edge

### Performance Testing

For changes that affect performance:
- Check initial load time
- Check response times for API calls
- Check chart render times
- Use Chrome DevTools Performance tab

## 📚 Documentation

### What to Document

**Always document:**
- New functions (JSDoc)
- New components (JSDoc with props)
- New API endpoints
- Configuration changes
- Breaking changes

**Example:**

```typescript
/**
 * Exports booking data to CSV format.
 * 
 * Creates a downloadable CSV file with all booking fields.
 * Handles special characters and commas in data by quoting fields.
 * 
 * @param bookings - Array of bookings to export
 * @param filename - Desired filename (without .csv extension)
 * @returns void - Triggers browser download
 * 
 * @example
 * exportToCSV(filteredBookings, 'january-bookings');
 * // Downloads: january-bookings.csv
 */
function exportToCSV(bookings: BookingData[], filename: string): void {
  // Implementation
}
```

### Documentation Files to Update

| Change Type | Files to Update |
|-------------|----------------|
| New feature | README.md, relevant docs |
| API change | API_DOCUMENTATION.md |
| Architecture change | ARCHITECTURE.md |
| Setup change | ONBOARDING.md |
| Process change | CONTRIBUTING.md (this file) |

## ❓ Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues and PRs
3. Open a discussion or issue
4. Email: rabbas@mail.umw.edu

## 🎉 Recognition

Contributors will be acknowledged in:
- Project README
- Release notes
- Commit history

Thank you for contributing to make DKC Booking Dashboard better!

---

**Last Updated:** January 2025

