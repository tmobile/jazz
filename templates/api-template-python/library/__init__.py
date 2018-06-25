import sys
import os

cur_dir = os.path.dirname(os.path.realpath(__file__))
# Adding installed site-packages folder to sys path
site_pkgs = os.path.join(cur_dir, "..", "venv", "lib", "python2.7",
                         "site-packages")
sys.path.append(site_pkgs)

# The following try block is a workaround for
# pep8 error - module level import not at top of file
try:
    # import the required packages here
    import requests
except Exception as e:
    raise e
