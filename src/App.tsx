import { StoreProvider } from './state/store';
import { Footer } from './ui/Footer';
import { Header } from './ui/Header';
import { Landing } from './ui/landing/Landing';
import { Placeholder } from './ui/Placeholder';
import { useRoute } from './ui/router';

function Page() {
  const route = useRoute();
  switch (route.page) {
    case 'versamenti':
      return <Placeholder title="I miei versamenti" />;
    case 'storico':
      return <Placeholder title="Storico" />;
    case 'parametri':
      return <Placeholder title="Parametri e fonti" />;
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
