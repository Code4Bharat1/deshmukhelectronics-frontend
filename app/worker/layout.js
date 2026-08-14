import AppShell from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';

export default function WorkerLayout({ children }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <ToastContainer />
    </>
  );
}
