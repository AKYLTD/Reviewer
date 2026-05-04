export const metadata = {
  title: { default: "Admin", template: "%s · Admin · Roni's" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
