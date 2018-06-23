## This is a Python Lambda template project

* requirements.txt contains python-packages which are required for the deployment package
* requirements-dev.txt contains development dependencies such as pytest which are only required locally for running tests, etc

#### To run tests follow these steps

    virtualenv venv
    . venv/bin/activate
    pip install -r requirements-dev.txt
    pytest test
