# UI Components Documentation

This document provides comprehensive documentation for all UI components in the 75 Hard Tracker application.

## Core Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui/button'

// Usage
<Button variant="default" size="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>
```

**Props:**
- `variant`: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
- `size`: "default" | "sm" | "lg" | "icon"
- `asChild`: boolean (use to render as a different component)
- All standard HTML button attributes

### Card

Container components for grouping related content.

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Usage
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Props:**
- `className`: string (additional CSS classes)
- All standard HTML div attributes

### Form

Comprehensive form components with validation using react-hook-form and zod.

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// Define schema
const formSchema = z.object({
  username: z.string().min(2).max(50),
})

// Usage
function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Input

Text input component with consistent styling.

```tsx
import { Input } from "@/components/ui/input"

// Usage
<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled input" />
```

**Props:**
- `type`: string (standard HTML input types)
- `className`: string
- All standard HTML input attributes

### Label

Label component for form inputs.

```tsx
import { Label } from "@/components/ui/label"

// Usage
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

**Props:**
- `htmlFor`: string (ID of associated input)
- `className`: string
- All standard HTML label attributes

## Modal Components

### Dialog

Base dialog/modal component from Radix UI.

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Usage
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description or instructions.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Dialog body content */}
    </div>
    <DialogFooter>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Modal (Custom Wrapper)

Simplified modal component with common patterns.

```tsx
import { Modal } from "@/components/ui/modal"

// Usage
<Modal
  trigger={<Button>Open Modal</Button>}
  title="Modal Title"
  description="Modal description"
  footer={
    <>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </>
  }
>
  <div>Modal content goes here</div>
</Modal>

// Controlled modal
const [open, setOpen] = useState(false)

<Modal
  open={open}
  onOpenChange={setOpen}
  title="Controlled Modal"
>
  <div>Content</div>
</Modal>
```

**Props:**
- `trigger`: ReactNode (optional trigger element)
- `title`: string (required)
- `description`: string (optional)
- `children`: ReactNode (modal body content)
- `footer`: ReactNode (optional footer content)
- `open`: boolean (controlled state)
- `onOpenChange`: (open: boolean) => void
- `showCloseButton`: boolean (default: true)
- `className`: string

### ConfirmModal

Specialized modal for confirmation dialogs.

```tsx
import { ConfirmModal } from "@/components/ui/modal"

// Usage
<ConfirmModal
  trigger={<Button variant="destructive">Delete</Button>}
  title="Confirm Deletion"
  description="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="destructive"
  onConfirm={async () => {
    // Handle deletion
    await deleteItem()
  }}
  onCancel={() => {
    // Optional cancel handler
  }}
/>
```

**Props:**
- `trigger`: ReactNode (optional)
- `title`: string (required)
- `description`: string (optional)
- `confirmText`: string (default: "Confirm")
- `cancelText`: string (default: "Cancel")
- `onConfirm`: () => void | Promise<void> (required)
- `onCancel`: () => void (optional)
- `variant`: "default" | "destructive"
- `open`: boolean (controlled state)
- `onOpenChange`: (open: boolean) => void

## Toast Notifications

### Toast Usage

The toast system uses Sonner for notifications.

```tsx
import { toast } from '@/lib/toast'

// Success toast
toast.success("Success!", "Your changes have been saved.")

// Error toast
toast.error("Error", "Something went wrong. Please try again.")

// Info toast
toast.info("Info", "New updates are available.")

// Warning toast
toast.warning("Warning", "This action may take a while.")

// Promise toast
const promise = saveData()
toast.promise(promise, {
  loading: "Saving...",
  success: "Data saved successfully!",
  error: "Failed to save data",
})

// Loading toast
const toastId = toast.loading("Processing...")
// Later...
toast.dismiss(toastId)
```

**Toast Methods:**
- `toast.success(message: string, description?: string)`
- `toast.error(message: string, description?: string)`
- `toast.info(message: string, description?: string)`
- `toast.warning(message: string, description?: string)`
- `toast.promise(promise, { loading, success, error })`
- `toast.loading(message: string)`
- `toast.dismiss(toastId?: string | number)`

## Theme Components

### ThemeProvider

Provides theme context for the entire application.

```tsx
// Already configured in app/layout.tsx
<ThemeProvider defaultTheme="dark" storageKey="75hard-theme">
  {children}
</ThemeProvider>
```

**Props:**
- `defaultTheme`: "light" | "dark" | "system"
- `storageKey`: string (localStorage key for theme preference)
- `children`: ReactNode

## Best Practices

1. **Consistency**: Always use these UI components instead of creating custom ones for consistency.

2. **Accessibility**: All components are built with accessibility in mind. Use proper labels and ARIA attributes.

3. **Type Safety**: Leverage TypeScript for type-safe props and better developer experience.

4. **Composition**: Combine components to create more complex UI patterns.

5. **Styling**: Use Tailwind classes for additional styling. The `cn()` utility helps merge classes.

```tsx
import { cn } from "@/lib/utils"

<Button className={cn("w-full", someCondition && "opacity-50")}>
  Full Width Button
</Button>
```

6. **Form Validation**: Always use zod schemas with react-hook-form for consistent validation.

7. **Loading States**: Show appropriate loading states using the Button's disabled state or loading toasts.

8. **Error Handling**: Use error toasts for user-facing errors and FormMessage for form validation errors.

## Examples

### Login Form Example

```tsx
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginSchema) {
    setIsLoading(true)
    try {
      await login(values)
      toast.success("Logged in successfully!")
    } catch (error) {
      toast.error("Login failed", "Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </Form>
  )
}
```

### Delete Confirmation Example

```tsx
function DeleteButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false)

  async function handleDelete() {
    await deleteItem(itemId)
    toast.success("Item deleted successfully")
  }

  return (
    <ConfirmModal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      }
      title="Delete Item"
      description="This action cannot be undone. Are you sure?"
      variant="destructive"
      onConfirm={handleDelete}
    />
  )
}
```