import Login from './login';

export const metadata = { title: 'Entrar · MI CUADERNO' };

export default function Page() {
  return (
    <main className="sheet">
      <h1>MI CUADERNO</h1>
      <p className="lead">Escribí tu usuario y tu PIN para abrir tu cuaderno.</p>
      <Login />
      <p className="note">Si te olvidaste el PIN, pedíselo a quien administra el cuaderno: lo puede cambiar.</p>
    </main>
  );
}
