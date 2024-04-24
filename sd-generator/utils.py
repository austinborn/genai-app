from os.path import exists
from uuid import uuid4
from config import config

escapes = ''.join([chr(char) for char in range(1, 32)])
translator = str.maketrans('', '', escapes)

def getFilePath(userId: str):
  while True:
    filePath = f"{config['USER_DIR_PWD']}users/{userId}/images/{uuid4()}.png"
    if not exists(filePath):
      return filePath
