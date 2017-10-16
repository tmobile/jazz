# =========================================================================
# Copyright 2017 T-Mobile USA, Inc.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =========================================================================

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
