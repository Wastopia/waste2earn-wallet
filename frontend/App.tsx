import React from "react";
import SwitchRoute from "./pages";
import { Provider } from "react-redux";
import store from "./redux/Store";
import "./App.scss";
import { queryClient } from "./config/query";
import { QueryClientProvider } from "@tanstack/react-query";
import EthereumSignInProviderWrapper from "./wrappers/EthereumSignInWrapper";
import LanguageWrapper from "./wrappers/LanguageWrapper";
import ThemeWrapper from "./wrappers/ThemeWrapper";
import DatabaseWrapper from "./wrappers/DatabaseWrapper";
import IdentityWrapper from "./wrappers/IdentityWrapper";
import { Toaster } from "react-hot-toast";

const App: React.FC = () => {
  return (
    <div className="App">
      <SwitchRoute />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4CAF50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#E53935',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default function AppWrapper() {
  return (
    <EthereumSignInProviderWrapper>
      <Provider store={store}>
        <IdentityWrapper>
          <QueryClientProvider client={queryClient}>
            <LanguageWrapper>
              <ThemeWrapper>
                <DatabaseWrapper>
                  <App />
                </DatabaseWrapper>
              </ThemeWrapper>
            </LanguageWrapper>
          </QueryClientProvider>
        </IdentityWrapper>
      </Provider>
    </EthereumSignInProviderWrapper>
  );
}
