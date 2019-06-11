## Python sls-app Template

* requirements.txt contains python packages that your function needs during its execution.
* requirements-dev.txt contains development dependencies such as pytest which are only required during local development and for running unit tests.

### To run unit tests locally, follow these steps -

#### Python 2.7

```python

    # install requirements in library folder
    mkdir library
    pip install -r requirements.txt -t library

    # create __init__.py in library
    touch library/__init__.py

    # create & activate virtual environment
    pip install virtualenv
    virtualenv venv
    . venv/bin/activate

    # install dev dependencies (includes pytest by default)
    pip install -r requirements-dev.txt

    # run tests
    pytest test
```

#### Python 2.7 (Windows)

```python

    # install requirements in library folder
    mkdir library
    pip install -r requirements.txt -t library

    # create __init__.py in library
    echo. 2>library/__init__.py

    # create & activate virtual environment
    pip install virtualenv
    virtualenv venv
    venv\Scripts\activate.bat

    # install dev dependencies (includes pytest by default)
    pip install -r requirements-dev.txt

    # run tests
    pytest test
```

#### Python 3.6

```python

    # install requirements in library folder
    mkdir library
    pip3 install -r requirements.txt -t library

    # create __init__.py in library
    touch library/__init__.py

    # create & activate virtual environment
    python3 -m venv virtualenv
    . virtualenv/bin/activate

    # install dev dependencies (includes pytest by default)
    pip install -r requirements-dev.txt

    # run tests
    pytest test

```

