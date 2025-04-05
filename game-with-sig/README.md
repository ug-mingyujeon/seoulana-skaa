# Cyberpunk Top-Down Shooter Game with Solana Integration

A cyberpunk-themed browser game that demonstrates seamless Solana blockchain integration using session key account abstraction.

## Features

- **Arcade-style Top-Down Shooter**: Fast-paced gameplay with cyberpunk aesthetics
- **Difficulty Levels**: Choose between Easy, Normal, and Hard gameplay modes
- **Upgrade System**: Collect points and upgrade your character during gameplay
- **Solana Integration**: In-game actions can trigger blockchain transactions
- **Session Key Integration**: Sign transactions without interrupting gameplay
- **Token Minting**: Earn game tokens as rewards for achievements

## How It Works

This game demonstrates how blockchain integration can be seamlessly incorporated into gameplay:

1. Players can connect to their wallet through the custom wallet server
2. The game uses session keys to sign transactions on behalf of the player
3. In-game actions (like reaching score thresholds) can trigger blockchain transactions
4. Players can earn tokens without interrupting the game flow
5. Transaction signing is handled through an unobtrusive overlay

## Setup Instructions

### Prerequisites

- A modern web browser
- The custom wallet server running (see [Custom Wallet Server Documentation](../custom-wallet-server/README.md))
- A local web server (optional, for running the game locally)

### Running the Game

The game is a standalone HTML file that can be opened directly in a browser or served through a web server:

1. Open `index.html` in your browser
2. Choose a difficulty level to start the game
3. Use WASD to move and mouse to aim and shoot
4. Collect points and upgrade your character

### Connecting to Solana

To enable the Solana functionality:

1. Start the custom wallet server (see [Custom Wallet Server Documentation](../custom-wallet-server/README.md))
2. Click the "Connect Wallet" button in the game
3. Complete the authentication flow
4. Your game will now be able to mint tokens as you progress

## Game Controls

- **Movement**: WASD keys
- **Aim**: Mouse cursor
- **Shoot**: Left mouse button
- **Dash**: Space bar (when upgraded)
- **Pause**: Escape key

## Integration with Backend

The game communicates with the custom wallet server for:

- User authentication
- Transaction signing
- Token minting

All blockchain interactions are designed to be non-intrusive to gameplay, demonstrating how session keys can improve user experience in blockchain games.

## Technical Implementation

The game is built with:

- HTML5 Canvas for rendering
- Vanilla JavaScript for game logic
- Custom CSS for styling and UI
- Integration with Solana web3.js for blockchain interactions

## License

[MIT License](../LICENSE) 