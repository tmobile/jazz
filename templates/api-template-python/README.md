## This is a python api template

* requirements.txt contains python packages that your function needs
* requirements-dev.txt contains development dependencies such as pytest which are only required locally for running tests, etc

### To run unit tests locally, follow these steps -

#### Python2.7
```python
    # install requirements in library folder
    mkdir library
    pip install -r requirements.txt -t library

    # create __init__.py in library, to make Python treat the 'library' as a package
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
#### Python3.6
```python
    # install requirements in library folder
    mkdir library
    pip3 install -r requirements.txt -t library

    # create __init__.py in library, to make Python treat the 'library' as a package
    touch library/__init__.py

    # create & activate virtual environment
    python3 -m venv virtualenv
    . virtualenv/bin/activate

    # install dev dependencies (includes pytest by default)
    pip install -r requirements-dev.txt

    # run tests
    pytest test
```

### [Windows] To run unit tests, follow these steps -

#### Python2.7

```python
    mkdir library
    pip install -r requirements.txt -t library
    echo. 2>library/__init__.py

    pip install virtualenv
    virtualenv venv
    venv\Scripts\activate.bat

    pip install pytest
    pytest test
```