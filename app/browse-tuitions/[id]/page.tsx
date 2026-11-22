import React from 'react';

const TuitionDetailsPage = ({params} : {params: {id: string}}) => {
    const {id} = params;
    console.log('id', id); 
    return (
        <div>
            <p>tution details</p>
        </div>
    );
};

export default TuitionDetailsPage;