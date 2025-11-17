<h1 align="center">
  @giovannimirulla/medusa-fulfillment-paccofacile
</h1>

<p align="center">
  Medusa fulfillment provider plugin for PaccoFacile shipping service
</p>

<p align="center">
  <strong>Author:</strong> <a href="https://giovannimirulla.com">Giovanni Mirulla</a>
</p>

---

# Medusa PaccoFacile Fulfillment Provider

A Medusa v2 fulfillment provider plugin that integrates with PaccoFacile shipping service, enabling automated shipping label generation, tracking, and order management.

## Features

- 🚚 **PaccoFacile Integration** - Direct integration with PaccoFacile shipping API
- 📦 **Automated Shipping** - Generate shipping labels and manage fulfillments
- 📍 **Tracking** - Track shipments and update order status
- ⚙️ **Admin UI** - Built-in admin widgets for managing shipments
- 🔧 **Configurable** - Flexible configuration for different shipping scenarios

## Prerequisites

- [Medusa >=2.11.3 backend](https://docs.medusajs.com)
- [PostgreSQL](https://docs.medusajs.com/development/backend/prepare-environment#postgresql)
- PaccoFacile API credentials

## Installation

1. Install the plugin:

\`\`\`bash
npm install @giovannimirulla/medusa-fulfillment-paccofacile
# or
yarn add @giovannimirulla/medusa-fulfillment-paccofacile
# or
bun add @giovannimirulla/medusa-fulfillment-paccofacile
\`\`\`

2. Add the plugin to your \`medusa-config.ts\`:

\`\`\`typescript
module.exports = defineConfig({
  plugins: [
    {
      resolve: '@giovannimirulla/medusa-fulfillment-paccofacile',
      options: {
        apiKey: process.env.PACCOFACILE_API_KEY,
        apiSecret: process.env.PACCOFACILE_API_SECRET,
        // Additional configuration options
      },
    },
  ],
});
\`\`\`

3. Set up environment variables in \`.env\`:

\`\`\`bash
PACCOFACILE_API_KEY=your_api_key
PACCOFACILE_API_SECRET=your_api_secret
\`\`\`

4. Run database migrations:

\`\`\`bash
npx medusa db:migrate
\`\`\`

## Configuration

### Environment Variables

\`\`\`bash
# Required
PACCOFACILE_API_KEY=your_api_key
PACCOFACILE_API_SECRET=your_api_secret

# Optional
PACCOFACILE_API_URL=https://api.paccofacile.it  # Default API endpoint
\`\`\`

### Plugin Options

\`\`\`typescript
{
  resolve: '@giovannimirulla/medusa-fulfillment-paccofacile',
  options: {
    apiKey: string,           // PaccoFacile API key
    apiSecret: string,        // PaccoFacile API secret
    apiUrl?: string,          // Custom API URL (optional)
    defaultService?: string,  // Default shipping service
    // Additional provider-specific options
  }
}
\`\`\`

## Usage

### Creating a Fulfillment

Once installed, PaccoFacile will be available as a fulfillment provider in your Medusa admin:

1. Navigate to an order in the admin panel
2. Select "Create Fulfillment"
3. Choose PaccoFacile as the provider
4. Generate shipping label

### Admin Features

The plugin includes admin widgets for:
- Viewing shipment details
- Tracking shipments
- Generating and downloading shipping labels
- Managing fulfillment workflows

## API Documentation

For detailed PaccoFacile API specifications, see the [API documentation](./docs/paccofacile-api.md).

## Development

### Local Setup

\`\`\`bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Development mode with hot-reload
npm run dev
\`\`\`

## Compatibility

This plugin is compatible with versions \`>= 2.11.3\` of \`@medusajs/medusa\`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For issues and questions:
- GitHub Issues: [medusa-fulfillment-paccofacile/issues](https://github.com/giovannimirulla/medusa-fulfillment-paccofacile/issues)
- Documentation: [docs.medusajs.com](https://docs.medusajs.com)

---

**Built for Medusa v2** 🚀
