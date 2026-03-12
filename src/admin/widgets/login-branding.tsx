import { defineWidgetConfig } from "@medusajs/admin-sdk"
import logo from "../assets/obs-logo.png"

const LoginBranding = () => {
  return (
    <div style={{ textAlign: "center", marginBottom: "16px" }}>
      <img
        src={logo}
        alt="OBS Jeans"
        style={{
          maxWidth: "220px",
          height: "auto",
          marginBottom: "8px",
        }}
      />
      <p
        style={{
          color: "#6b7280",
          fontSize: "14px",
          margin: 0,
        }}
      >
        Panel de Administración
      </p>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBranding
