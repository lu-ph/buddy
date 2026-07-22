---
name: present-pdf
description: Open a PDF file and jump to a specific page using SumatraPDF CLI for presentation.
---

### SumatraPDF CLI Commands

#### 1. Open PDF in Fullscreen
```bash
# Presentation mode 
!`${CLAUDE_SKILL_DIR}/scripts/SumatraPDF-3.6.1-64.exe` -presentation "file_path.pdf"
```

#### 2. Open PDF and Jump to Specific Page
```bash
# Open and jump to page N
!`${CLAUDE_SKILL_DIR}/scripts/SumatraPDF-3.6.1-64.exe` -page 42 "file_path.pdf"

# Recommended: Fullscreen + jump to specific page
!`${CLAUDE_SKILL_DIR}/scripts/SumatraPDF-3.6.1-64.exe` -fullscreen -page 42 "file_path.pdf"

# Reuse existing instance (recommended)
!`${CLAUDE_SKILL_DIR}/scripts/SumatraPDF-3.6.1-64.exe` -reuse-instance -page 15 "file_path.pdf"
```

#### 3. View PDF Information
```bash
# Show PDF metadata and general information
!`${CLAUDE_SKILL_DIR}/scripts/SumatraPDF-3.6.1-64.exe` info "file_path.pdf"
```


