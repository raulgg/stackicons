export const UI_THEME_RESET_FLAG = "ui-theme-reset-v1";

// One-time reset of the stored UI theme so every user re-defaults to system
// after the System option shipped — the old toggle forced a Light/Dark pin.
// Rendered as an inline script ahead of the theme provider so it runs before
// the next-themes init script reads localStorage. See ADR 0003.
export const uiThemeResetScript = `try{if(!localStorage.getItem("${UI_THEME_RESET_FLAG}")){localStorage.removeItem("theme");localStorage.setItem("${UI_THEME_RESET_FLAG}","1")}}catch(e){}`;
