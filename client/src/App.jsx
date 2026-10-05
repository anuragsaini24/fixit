import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AdminLayout, CustomerLayout, ProviderLayout, PublicLayout } from './layouts/Layouts';
import { CustomerBookingsPage, CustomerDashboardPage } from './pages/CustomerPages';
import { BookingPage, LandingPage, LoginPage, ProviderProfilePage as PublicProviderProfilePage, ProvidersPage, RegisterPage, ReviewPage, ServicesPage, TrackingPage } from './pages/MarketplacePages';
import SmartSuggestionPage from './pages/SmartAssistantPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordRecoveryPages';
import { AdminBookingsPage, AdminDashboardPage, AdminProvidersPage, AdminReviewsPage, AdminServicesPage, AdminUsersPage, ProviderDashboardPage, ProviderEarningsPage, ProviderJobsPage, ProviderProfilePage, ProviderRequestsPage } from './pages/WorkspacePages';

export default function App() {
  return <BrowserRouter><Routes>
    <Route element={<PublicLayout />}>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="providers" element={<ProvidersPage />} />
      <Route path="provider/:id" element={<PublicProviderProfilePage />} />
      <Route path="booking" element={<BookingPage />} />
      <Route path="tracking/:id" element={<TrackingPage />} />
      <Route path="review" element={<ReviewPage />} />
      <Route path="smart-suggestion" element={<SmartSuggestionPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['customer']} />}>
      <Route element={<CustomerLayout />}>
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="bookings" element={<CustomerBookingsPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['provider']} />}>
      <Route element={<ProviderLayout />}>
        <Route path="provider/dashboard" element={<ProviderDashboardPage />} />
        <Route path="provider/requests" element={<ProviderRequestsPage />} />
        <Route path="provider/jobs" element={<ProviderJobsPage />} />
        <Route path="provider/earnings" element={<ProviderEarningsPage />} />
        <Route path="provider/profile" element={<ProviderProfilePage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute roles={['admin']} />}>
      <Route element={<AdminLayout />}>
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/providers" element={<AdminProvidersPage />} />
        <Route path="admin/bookings" element={<AdminBookingsPage />} />
        <Route path="admin/services" element={<AdminServicesPage />} />
        <Route path="admin/reviews" element={<AdminReviewsPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
