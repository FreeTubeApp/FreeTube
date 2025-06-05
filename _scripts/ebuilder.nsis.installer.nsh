!macro customRemoveFiles
${if} ${isUpdated}
  !insertmacro quitSuccess
${else}
  RMDir /r $INSTDIR
${endIf}
!macroend
