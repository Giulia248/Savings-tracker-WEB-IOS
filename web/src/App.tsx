import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { AddTransactionPage } from "./pages/AddTransactionPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NewsPage } from "./pages/NewsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RequireProfile, SessionProvider } from "./session/session";

export function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireProfile />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="add" element={<AddTransactionPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <p className="app-version muted">v{__APP_VERSION__}</p>
    </SessionProvider>
  );
}
