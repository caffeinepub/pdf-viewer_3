import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import ViewerPage from "./pages/ViewerPage";
import AdminPage from "./pages/AdminPage";

// Root route — no layout chrome
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ViewerPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([indexRoute, adminRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Re-export Link for use in pages
export { Link };

export default function App() {
  return <RouterProvider router={router} />;
}
