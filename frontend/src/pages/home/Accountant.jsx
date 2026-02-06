import React from 'react'
import Form1 from '../../components/DisplayForms/Form1'
import Form2 from '../../components/DisplayForms/Form2'
import Form3 from '../../components/DisplayForms/Form3'
import Form4 from '../../components/DisplayForms/Form4'
import Form8 from '../../components/DisplayForms/Form8'
import Form5A from '../../components/DisplayForms/Form5A'
import Form5B from '../../components/DisplayForms/Form5B'
import Form5C from '../../components/DisplayForms/Form5C'
import Form5D from '../../components/DisplayForms/Form5D'
import Form5E from '../../components/DisplayForms/Form5E'
import Form6 from '../../components/DisplayForms/Form6'
import Form7 from '../../components/DisplayForms/Form7'
import Form7A from '../../components/DisplayForms/Form7A'
import Form9 from '../../components/DisplayForms/Form9'
import Form10 from '../../components/DisplayForms/Form10'
import Form11 from '../../components/DisplayForms/Form11'
import Form12 from '../../components/DisplayForms/Form12'
import Form7B from '../../components/DisplayForms/Form7B'
import Statement7 from '../../components/Statements/Statement7'
import Statement6 from '../../components/Statements/Statement6'
import Statement5 from '../../components/Statements/Statement5'
import Statement4 from '../../components/Statements/Statement4'
import Statement2 from '../../components/Statements/Statement2'
import Statement3 from '../../components/Statements/Statement3'
import Statement1 from '../../components/Statements/Statement1'
import SearchFunction from '../../features/SearchFunction'

const Accountant = () => {
  return (
    <div className='flex flex-col gap-5 p-4'>
      <SearchFunction />
      <Statement2 />
      {/* <Form1/> */}
    </div>
  )
}

export default Accountant