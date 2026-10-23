import { StoreProvider } from './state/store';
import { Footer } from './ui/Footer';
import { Header } from './ui/Header';
import { Landing } from './ui/landing/Landing';
import { Parametri } from './ui/pages/Parametri';
import { Storico } from './ui/pages/Storico';
import { Versamenti } from './ui/pages/Versamenti';
import { useRoute } from './ui/router';

function Page() {
  const route = useRoute();
  switch (route.page) {
    case 'versamenti':
      return <Versamenti />;
    case 'storico':
      return <Storico />;
    case 'parametri':
      return <Parametri anchor={route.anchor} />;
    default:
      return <Landing />;
  }
}

export function App() {
  return (
    <StoreProvider>
      <Header />
      <Page />
      <Footer />
    </StoreProvider>
  );
}
