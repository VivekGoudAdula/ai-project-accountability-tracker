import { ReactNode, createContext, useContext, useState } from 'react';
import AppSidebar from './AppSidebar';
import TopNavbar from './TopNavbar';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false, setCollapsed: () => {} });
export const useSidebarState = () => useContext(SidebarContext);

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <div
          className="transition-all duration-200"
          style={{ paddingLeft: collapsed ? 72 : 240 }}
        >
          <TopNavbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
