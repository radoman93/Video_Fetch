# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building the Application

#### GUI Build (Windows)
```powershell
# Install dependencies
pip install -r requirements.txt
pip install PySide6 nuitka zstandard pywin32 av

# Build with pyside6-deploy
pyside6-deploy -c src/build/pysidedeploy_windows.spec -f -v
```

#### CLI Build (Windows)
```powershell
pip install -r requirements_cli.txt
python -m nuitka --standalone --onefile Porn_Fetch_CLI.py
```

#### Linux Build
```bash
# Use the install script
bash src/scripts/install.sh
```

#### macOS Build
```bash
# Use the macOS install script
bash src/scripts/install_macos.sh
# Note: Built .app needs to be run from terminal: ./<app>.app/Contents/MacOS/main
```

### Running the Application

#### GUI Mode
```bash
python main.py
```

#### CLI Mode
```bash
python Porn_Fetch_CLI.py
```

#### Android (via Termux)
```bash
python main_android.py
```

### Dependencies Management
```bash
# GUI dependencies
pip install -r requirements.txt

# CLI dependencies
pip install -r requirements_cli.txt

# Update UI resources
cd src/frontend/
./update.sh  # Linux/macOS
./update.ps1 # Windows
```

## High-Level Architecture

### Project Structure
The application is a multi-platform video downloader with both GUI and CLI interfaces, supporting Windows, Linux, macOS, and Android.

### Core Components

#### Entry Points
- **main.py**: Main GUI application entry using PySide6/Qt framework
- **Porn_Fetch_CLI.py**: Command-line interface with rich terminal UI
- **main_android.py**: Android-specific entry point with QML UI

#### Backend Architecture (`src/backend/`)
- **shared_functions.py**: Core functionality shared between GUI and CLI
  - Manages API clients for different video platforms
  - Handles video downloading, quality selection, and metadata
  - Uses multiple API libraries (PHUB, hqporner_api, xnxx_api, etc.)

- **config.py**: Configuration management
  - Handles user settings and preferences
  - Manages installation modes (portable vs installed)

- **shared_gui.py**: GUI-specific shared functionality
- **CLI_model_feature_addon.py**: CLI-specific features for model/channel downloads

#### Frontend Architecture (`src/frontend/`)
- **UI/**: Contains Qt Designer UI files and generated Python UI code
  - `ui_form_main_window.py`: Main window UI
  - `ui_form_android.py`: Android-specific UI
- **stylesheets/**: Qt stylesheets for theming
- **translations/**: Internationalization files
- **graphics/**: Application icons and images

### API Integration Pattern
The application uses a modular client system where each video platform has its own API client:
- Each client is initialized globally in `shared_functions.py`
- Clients share a common BaseCore configuration system
- The `refresh_clients()` function reinitializes all clients with updated settings

### Video Processing Flow
1. URL parsing to determine platform
2. Video object creation using platform-specific API
3. Quality selection based on user preferences
4. Multi-threaded download with progress tracking
5. Optional metadata writing and file conversion (MPEG-TS to MP4)

### Configuration System
- Uses INI file format (`config.ini`)
- Sections: Setup, Performance, Video, UI, Sponsoring, Android
- Supports both installation and portable modes
- Manages user preferences like quality, output paths, threading settings

### Platform-Specific Considerations
- **Windows**: Uses pywin32 for system integration
- **Linux**: Supports both X11 and Wayland
- **macOS**: Requires special handling for .app bundle execution
- **Android**: Uses Termux environment with QML-based UI

## Important Notes

- The application uses Nuitka for compilation to native executables
- FFmpeg is required for video processing and conversion
- Multi-threading is extensively used for concurrent downloads
- The codebase supports 8+ different video platforms through dedicated API libraries
- Logging system uses both file and HTTP logging capabilities
- Proxy support is experimental but available through BaseCore configuration