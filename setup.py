from setuptools import setup
import os

contracts_dir_name = "contracts"
data_files = {}
for dir_name, subdirs, file_names in os.walk(contracts_dir_name):
    for file_name in file_names:
        file_path = os.path.join(dir_name, file_name)
        contract_files = data_files.get(dir_name, [])
        contract_files.append(file_path)
        data_files[dir_name] = contract_files

setup(
    name="zeppelin-solidity",
    version="1.4.0",
    description="Secure Smart Contract library for Solidity",
    url="https://github.com/OpenZeppelin/zeppelin-solidity.git",
    author="Manuel Araoz",
    author_email = "manuelaraoz@gmail.com",
    packages=[],
    data_files=data_files.items()
)
