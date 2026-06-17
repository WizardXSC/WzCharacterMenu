# Standalone Character Menu

A custom standalone character menu for FiveM servers. It features a modern transparent glassmorphic UI, custom keyboard-only controls, camera controls, local outfit template saving (KVP), and sharing code utilities.

## Features

- **Keyboard-Driven Navigation**: Use arrow keys, enter, and backspace for navigating the UI. No mouse cursor is used.
- **Form Button Navigation**: Custom horizontal layout for modal prompts (Save/Import inputs) using ArrowLeft/ArrowRight, while ArrowUp returns you to the text input field.
- **Cinematic Camera System**: Locks camera rotation and focus dynamically onto the ped (focuses head on facial/props, focuses body on clothes).
- **Standalone KVP Savings**: Characters are saved directly to client-side cache using FiveM's native KVPs, so you don't need SQL database configurations.
- **Ped Rotation**: Press `SPACE` inside the menu to instantly spin the ped 180 degrees.
- **Outfit Sharing**: Base64 sharing codes let players export or import outfits. Click "Copy Code" to copy it straight to your clipboard.
- **Access List (Steam Hex)**: Restrict Custom Ped models choice to specified Steam hexes via `config.lua` or allow everyone to choose them.

## Installation

1. Drag the `WzCharacterMenu` resource folder into your server's `resources` directory.
2. Add `ensure WzCharacterMenu` to your `server.cfg`.
3. Open `config.lua` and adjust your command (`charactermenu`), default keybind, locale, and Custom Ped permissions.
4. Restart your server or run `/ensure WzCharacterMenu`.

## Configuration (`config.lua`)

Inside the configuration file, you can set the following permissions for Custom Peds choice:

```lua
Config.CustomPedsAllowAll = false -- Set to true to allow everyone to use custom peds

Config.CustomPedAccess = {
    "steam:1100001abcdef12", -- Example Steam Hex format (lowercase)
}
```

## Key Controls

- **`M`**: Opens and closes the menu (RegisterKeyMapping).
- **`ArrowUp` / `ArrowDown`**: Move selection vertically.
- **`ArrowLeft` / `ArrowRight`**: Edit drawable variants or select Save/Cancel buttons.
- **`Enter`**: Choose submenus, blur inputs, or cycle texture variations.
- **`Backspace`**: Go back in submenus.
- **`SPACE`**: Rotates character 180°.
