mergeInto(LibraryManager.library, {

  GetJWT: function () {
    var returnStr = localStorage.getItem("token") || "";
    var bufferSize = lengthBytesUTF8(returnStr) + 1;
    var buffer = _malloc(bufferSize);
    stringToUTF8(returnStr, buffer, bufferSize);
    return buffer;
  },

});