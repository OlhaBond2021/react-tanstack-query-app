import { useIsFetching } from "@tanstack/react-query";

export default function Header({ children }) {
  //fetching === 0 якщо не відправляє жодного запиту, або більше число якщо отримує якісь дані
  const fetching = useIsFetching();

  return (
    <>
      <div id="main-header-loading">{fetching > 0 && <progress />}</div>
      <header id="main-header">
        <div id="header-title">
          <h1>React Events</h1>
        </div>
        <nav>{children}</nav>
      </header>
    </>
  );
}
