# Deployment & VPS Server Reference

This document records the VPS and Dokploy configuration for **Bayview Village Ltd (CRM & Web)** so future sessions and developers have immediate access to deployment details.

---

## 1. VPS & Dokploy Configuration
- **Server IP:** `69.62.106.189`
- **SSH User:** `root`
- **Dokploy Dashboard:** `http://69.62.106.189:3000`
- **Dokploy Project Name:** `Bayview Village`
- **Dokploy App Name:** `bayview-app` (`bayview-village-bayviewapp-tid2nh`)
- **Application ID:** `e_fD0Ed0CTYPbQIXvKigr`
- **Refresh / Webhook Token:** `97Rvo9uWIncIa6JSAQDPm`

---

## 2. Live Domains (Traefik Router)
- **CRM Portal:** [https://crm.bayviewvillageltd.com](https://crm.bayviewvillageltd.com)
- **Main Website:** [https://bayviewvillageltd.com](https://bayviewvillageltd.com)
- **Direct Sslip Fallback:** `http://bayview-village-bayviewapp-tid2nh-ab58ac-69-62-106-189.sslip.io`

---

## 3. Auto-Deployment Webhook
- **Webhook Endpoint:**
  ```
  http://69.62.106.189:3000/api/deploy/97Rvo9uWIncIa6JSAQDPm
  ```
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `x-github-event: push`
- **Payload:**
  ```json
  { "ref": "refs/heads/main" }
  ```

---

## 4. GitHub Integration
- **GitHub Repository:** [Aggrey444/bayview-crm](https://github.com/Aggrey444/bayview-crm.git)
- **Branch:** `main`
- **CI/CD:** Configured via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) so every `git push origin main` triggers Dokploy to pull and deploy the latest build automatically.
