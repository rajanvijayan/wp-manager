<p align="center">
  <img src="build/icon.svg" alt="WP Manager Logo" width="128" height="128">
</p>

<h1 align="center">WP Manager</h1>

<p align="center">
  <strong>Manage all your WordPress websites from one powerful desktop app</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/electron-28.0.0-blue" alt="Electron">
  <img src="https://img.shields.io/badge/react-18.2.0-61dafb" alt="React">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## ✨ Features

### 🌐 Multi-Site Management
- Connect and manage unlimited WordPress websites from a single dashboard
- Real-time status monitoring for all your sites
- Quick access to WordPress admin panels

### 🔌 Plugin Management
- View all plugins across all your sites
- Update plugins with one click
- Identify outdated plugins that need attention

### 🎨 Theme Management
- Browse themes installed on your sites
- Update themes easily
- Activate themes remotely

### 👤 Client Management
- Store client information for each site
- Track client contact details (name, email, company, phone)
- Enable monthly report emails for clients

### 📊 Dashboard Overview
- Beautiful dashboard with site statistics
- Quick actions for common tasks
- Real-time sync status

### 🌙 Dark & Light Mode
- Beautiful dark mode by default
- Switch to light mode if preferred
- Settings persist across sessions

## 📦 Installation

### Download

Download the latest release for your platform:

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [WP Manager-x.x.x-arm64.dmg](https://github.com/username/wp-manager/releases/latest) |
| macOS (Intel) | [WP Manager-x.x.x-x64.dmg](https://github.com/username/wp-manager/releases/latest) |
| Windows | [WP Manager-x.x.x-setup.exe](https://github.com/username/wp-manager/releases/latest) |
| Linux (AppImage) | [WP Manager-x.x.x.AppImage](https://github.com/username/wp-manager/releases/latest) |
| Linux (Debian) | [wp-manager_x.x.x_amd64.deb](https://github.com/username/wp-manager/releases/latest) |

### Requirements

- **macOS**: 10.13 or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04 or later (or equivalent)

## 🚀 Usage

### Connecting a WordPress Site

1. Install the **WP Manager Connector** plugin on your WordPress site
2. Generate API credentials from the plugin settings
3. Click **"Add Site"** in WP Manager
4. Enter your site URL and API credentials
5. Optionally add client information for the site

### Managing Plugins & Themes

1. Navigate to **Plugins** or **Themes** from the sidebar
2. View all plugins/themes across your connected sites
3. Click **"Update"** to update outdated items
4. Use bulk actions for efficiency

### Client Reports

1. Edit a site and add client information
2. Enable **"Monthly Reports"** toggle
3. Reports will be sent automatically each month

## 🛠️ Development

### Prerequisites

- Node.js 20.x or later
- npm 9.x or later

### Setup

```bash
# Clone the repository
git clone https://github.com/username/wp-manager.git
cd wp-manager

# Install dependencies
npm install

# Generate app icons
npm run generate:icons

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run generate:icons` | Generate app icons from SVG |

### Project Structure

```
wp-manager/
├── .github/workflows/    # GitHub Actions CI/CD
├── build/                # App icons and assets
├── electron/             # Electron main & preload scripts
│   ├── main.ts          # Main process
│   └── preload.ts       # Preload script (IPC bridge)
├── src/                  # React frontend
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── store/           # Zustand state management
│   └── styles/          # Global styles
├── scripts/              # Build scripts
└── package.json
```

### Building for Production

```bash
# Build for all platforms
npm run build

# Build outputs are in the `release/` directory
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://www.electronjs.org/) - Desktop app framework
- [React](https://reactjs.org/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

---

<p align="center">
  Made with ❤️ for WordPress developers and agencies
</p>
