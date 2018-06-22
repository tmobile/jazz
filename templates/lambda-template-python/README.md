## This is a Python Lambda template project

* requirements.txt contains python-pakages which are required for the deployment package

#### To run tests follow these steps

    # install requirements in library folder
    mkdir library
    pip install -r requirements.txt -t library

    # create __init__.py in library, to make Python treat the 'library' as a package
    touch library/__init__.py

    # create & activate virtual environment
    pip install virtualenv
    virtualenv venv
    . venv/bin/activate

    # install pytest module
    pip install pytest

    # run tests
    pytest test


#### To run tests follow these steps (in windows)
    mkdir library
    pip install -r requirements.txt -t library
    echo. 2>library/__init__.py

    pip install virtualenv
    virtualenv venv
    venv\Scripts\activate.bat
    
    pip install pytest
    pytest test
