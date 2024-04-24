import os

config = {
  'API_KEY': os.environ.get('API_KEY'),
  'MOCK_SD': os.environ.get('MOCK_SD', 'false'),
  'MOCK_GEN_S': os.environ.get('MOCK_GEN_S', '2'),
  'USER_DIR_PWD': os.environ.get('USER_DIR_PWD', '')
}
