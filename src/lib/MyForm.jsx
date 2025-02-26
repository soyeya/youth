import React, { createContext, createElement , useState, useEffect, useContext} from 'react';



export const useForm = ({ initialValue, validate, onSubmit }) => {
    const [values, setValues] = useState(initialValue);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
  
    const handleChange = (e) => {
      setValues({
        ...values,
        [e.target.name]: e.target.value,
      });
    };
  
    const handleBlur = (e) => {
      setTouched({
        ...touched,
        [e.target.name]: true,
      });
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
  
      const nextTouched = Object.keys(values).reduce((touched, field) => {
        touched[field] = true;
        return touched;
      }, {});
      setTouched(nextTouched);
  
      const errors = validate(values);
      setErrors(errors);
      if (Object.values(errors).some(Boolean)) return;
  
      onSubmit(values);
    };
  
    const getFieldProps = (name) => {
      const value = values[name];
      const onBlur = handleBlur;
      const onChange = handleChange;
  
      return {
        name,
        value,
        onBlur,
        onChange,
      };
    };
  
    useEffect(() => {
      setErrors(validate(values));
    }, [values]);
  
    return {
      values,
      errors,
      touched,
      handleBlur,
      handleChange,
      handleSubmit,
      getFieldProps,
    };
  };

const formContext = createContext({});
formContext.displayName = "FormContext";

export const Form = ({ id, className, children , ...rest}) => {
    const formValue = useForm(rest);
     return(
        <formContext.Provider value={formValue}>
            <form 
            noValidate
            id={id}
            className={className}
            >
            {children}    
            </form>
        </formContext.Provider>
     )
}


export const FormField = ({ as = "input", children , ...rest}) => {

    const { getFieldProps } = useContext(formContext);
     return createElement(
       as,
       {...rest , ...getFieldProps(rest.name)},
       children
     )
}

export const ErrorMessage = ({ name }) => {
    const { touched, errors } = useContext(formContext);
    if (!touched[name] || !errors[name]) return null;
    return <span>{errors[name]}</span>;
  };