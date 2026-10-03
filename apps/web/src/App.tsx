import { BrowserRouter, Outlet, Route, Routes } from "react-router"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Home } from "@/pages/home"
import { Map } from "@/pages/map"
import { Showcase } from "@/pages/showcase"

function SiteLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

// Full-height layout without a footer: the map fills what the header leaves.
function MapLayout() {
  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <SiteHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
        </Route>
        <Route element={<MapLayout />}>
          <Route path="map" element={<Map />} />
        </Route>
        <Route path="ui" element={<Showcase />} />
      </Routes>
    </BrowserRouter>
  )
}
