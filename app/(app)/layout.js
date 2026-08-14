import AppShell from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';

export default function AppLayout({ children }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <ToastContainer />
    </>
  );
}
