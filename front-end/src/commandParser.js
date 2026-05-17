export const parseCommand = (input) => {
  const normalizedInput = input.toLowerCase().trim();
  const commands = [];

  // Keyword matchers - check for multiple matches
  if (normalizedInput.includes('youtube')) commands.push('open_youtube');
  if (normalizedInput.includes('facebook')) commands.push('open_facebook');
  if (normalizedInput.includes('instagram')) commands.push('open_instagram');
  if (normalizedInput.includes('google') && !normalizedInput.includes('google chrome')) commands.push('open_google');
  
  if (normalizedInput.includes('store') || normalizedInput.includes('microsoft store')) commands.push('open_ms_store');
  if (normalizedInput.includes('vs code') || normalizedInput.includes('vbs code') || normalizedInput.includes('vscode')) commands.push('open_vscode');
  if (normalizedInput.includes('shutdown') || normalizedInput.includes('shut down')) commands.push('shutdown_pc');
  if (normalizedInput.includes('sleep') && normalizedInput.includes('pc')) commands.push('sleep_pc');
  
  if (normalizedInput.includes('wifi') || normalizedInput.includes('wi-fi')) {
    if (normalizedInput.includes('off') || normalizedInput.includes('turn off') || normalizedInput.includes('disable')) commands.push('wifi_off');
    else if (normalizedInput.includes('on') || normalizedInput.includes('turn on') || normalizedInput.includes('enable')) commands.push('wifi_on');
  }

  if (normalizedInput.includes('bluetooth')) {
    if (normalizedInput.includes('off') || normalizedInput.includes('turn off') || normalizedInput.includes('disable')) commands.push('bluetooth_off');
    else if (normalizedInput.includes('on') || normalizedInput.includes('turn on') || normalizedInput.includes('enable')) commands.push('bluetooth_on');
  }

  if (normalizedInput.includes('volume')) {
    if (normalizedInput.includes('up') || normalizedInput.includes('increase')) commands.push('volume_up');
    else if (normalizedInput.includes('down') || normalizedInput.includes('decrease')) commands.push('volume_down');
  }

  if (normalizedInput.includes('brightness')) {
    if (normalizedInput.includes('up') || normalizedInput.includes('increase')) commands.push('brightness_up');
    else if (normalizedInput.includes('down') || normalizedInput.includes('decrease')) commands.push('brightness_down');
  }

  return commands.length > 0 ? commands : null;
};
